$(function(){
    var cboyear = 2015;
    while (cboyear<=new Date().getFullYear()) {
        $('#year').append('<option value="'+cboyear+'">'+cboyear+'</option>')
        cboyear++;
    }

    $('#month').on('change',function(){
        var monat= $('#month').val();
        var jahr= $('#year').val();

    $('#Umsatzsumme').empty();
    $('#myVisitors').empty();        

        $.ajax({
            type: 'GET',
            url: '/members/visitors/get',
            data:{
                monat: monat,
                jahr: jahr
            },
            success: function(data){
                var umsatzsumme=parseRents(data);                

                $('#Umsatzsumme').text(umsatzsumme.toFixed(2).replace('.',',')+' €');
            }
        });
    });

    $('#year').on('change',function(){
        var monat= $('#month').val();
        var jahr= $('#year').val();

        $('#Umsatzsumme').empty();
        $('#myVisitors').empty();

        $.ajax({
            type: 'GET',
            url: '/members/visitors/get',
            data:{
                monat: monat,
                jahr: jahr
            },
            success: function(data){
                var umsatzsumme=parseRents(data);
                
                $('#Umsatzsumme').text(umsatzsumme.toFixed(2).replace('.',',')+' €');
            }
        });
    });

    $('#checkAllVisitors').change(function(){
        if ($('#checkAllVisitors').is(':checked')){
            $('#heading').text('Alle Gastumsätze');
            $('#month').parent().toggle();
            $('#year').parent().toggle();
            $('#myVisitors').empty();
            $.ajax({
                type:'GET',
                url:'/board/visitors',
                success: function(data){
                    var umsatzsumme=parseRents(data);
                
                    $('#Umsatzsumme').text(umsatzsumme.toFixed(2).replace('.',',')+' €');
                }
            });
        } else {
            $('#heading').text('Meine Umsätze mit Gastspielern');
            $('#month').parent().toggle();
            $('#year').parent().toggle();
        }
    });

    var parseRents = function(data){
        var umsatzsumme = 0;
        $.each(data.rents,function(i, element){
            umsatzsumme +=element.betrag;
            var Datum = moment(element.datum).format('DD.MM.YYYY');
            var row = '<tr><td>'+Datum+'</td><td>'+element.player+'</td><td>'+element.spielzeit.toFixed(1).replace('.',',')+' h'+'</td><td>'+(element.betrag/100).toFixed(2).replace('.', ",")+' €'+'</td>'
            if (data.admin){
                row+='<td><button role="button" class="btn btn-danger deleteBreak">Löschen</button></td></tr>';
            } else {
                row += '</tr>';
            }
            $('#navbarNavAltMarkup').removeClass('show');
            $('#myVisitors').append(row);
        });
        return umsatzsumme/100;
    }
});