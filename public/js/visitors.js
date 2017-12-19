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

    var parseRents = function(data){
        var umsatzsumme = 0;
        $.each(data.rents,function(i, element){
            umsatzsumme +=element.betrag;
            var Datum = moment(element.datum).format('DD.MM.YYYY');
            $('#navbarNavAltMarkup').removeClass('show');
            $('#myVisitors').append('<tr><td>'+Datum+'</td><td>'+element.player+'</td><td>'+element.spielzeit.toFixed(1).replace('.',',')+' h'+'</td><td>'+element.betrag.toFixed(2).replace('.', ",")+' €'+'</td></tr>');
        });
        return umsatzsumme;
    }
});