$(function(){
    $('#checkBreak').on('change',function(){
        if ($('#checkBreak').is(':checked')) {
            $('#heading').text('Alle Breaks');
            $.ajax({
                type: 'GET',
                url: '/board/breaks',
                success: function(breaks){
                    $('#myBreaks').empty();
                    breaks.forEach((b,i) => {
                        $('#myBreaks').append('<tr><th>'+(i+1)+'.'+'</th><td>'+
                        moment(b.datum).format('DD.MM.YYYY')+'</td><td>'+
                        b.player+'</td><td>'+
                        b.break+
                        '</td><td><button role="button" class="btn btn-danger deleteBreak">Löschen</button></td></tr>')
                    });
                }
            });
        } else {
            $('#heading').text('Meine Breaks');
            $.ajax({
                type: 'GET',
                url: '/board/userbreaks',
                success: function(data){
                    $('#myBreaks').empty();
                    if (data.info) {
                        if ($('div.alert-warning').length === 0){
                            $('.container').before('<div class="alert small alert-warning alert-dismissable "><a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>'+
                            data.info+'</div>');
                        }
                    } else {
                        data.sort((a,b)=>{
                            if (a.break < b.break) {
                                return 1;
                            } else if (a.break > b.break) {
                                return -1;
                            } else {
                              return 0;
                            }
                        }).forEach((b,i) => {
                            $('#myBreaks').append('<tr><th>'+(i+1)+'.'+'</th><td>'+
                            moment(b.datum).format('DD.MM.YYYY')+'</td><td>'+
                            b.player+'</td><td>'+
                            b.break+'</tr>');
                        });
                    }
                }
            });
        }
    });

    $(document).on('click','.deleteBreak', function(){
        var $row = $(this).closest('tr').children();
        
        var datum= $row[1].textContent;
        var player= $row[2].textContent;
        var serie= $row[3].textContent;

        $.ajax({
            type: 'GET',
            url: '/board/deletebreak',
            data:{
                datum: datum,
                player: player,
                break: serie
            },
            success: function(serie){
                location.reload();
            }
        });
    });
});